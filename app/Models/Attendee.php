<?php

namespace App\Models;

use Database\Factories\AttendeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $event_id
 * @property string $status
 * @property bool $is_attending
 * @property string|null $prefix_name
 * @property int $category_id
 * @property string $fullname
 * @property string|null $position
 * @property string|null $agency_name
 * @property string|null $rep_prefix_name
 * @property string|null $rep_fullname
 * @property string|null $rep_position
 * @property int|null $province_id
 * @property int|null $city_id
 * @property int|null $brgy_id
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $name
 * @property-read string|null $rep_name
 * @property-read bool $is_announced
 */
#[Fillable([
    'event_id',
    'status',
    'is_attending',
    'prefix_name',
    'category_id',
    'fullname',
    'position',
    'agency_name',
    'rep_prefix_name',
    'rep_fullname',
    'rep_position',
    'province_id',
    'city_id',
    'brgy_id',
    'created_by',
    'created_at',
])]
class Attendee extends Model
{
    /** @use HasFactory<AttendeeFactory> */
    use HasFactory;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'registered',
        'is_attending' => false,
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'name',
        'rep_name',
        'is_announced',
        'office_agency',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Attendee $attendee) {
            if (empty($attendee->status)) {
                $attendee->status = 'registered';
            }

            if (empty($attendee->created_by) && auth()->check()) {
                $attendee->created_by = auth()->id();
            }

            if (empty($attendee->created_at)) {
                $attendee->created_at = now();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_attending' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Formatted representative name with prefix if present.
     */
    public function getRepNameAttribute(): ?string
    {
        if (empty($this->rep_fullname)) {
            return null;
        }

        $prefix = $this->rep_prefix_name ? trim($this->rep_prefix_name).' ' : '';

        return trim("{$prefix}{$this->rep_fullname}");
    }

    /**
     * Alias for fullname to support legacy and template references.
     */
    public function getNameAttribute(): string
    {
        $prefix = $this->prefix_name ? trim($this->prefix_name).' ' : '';

        return trim("{$prefix}{$this->fullname}");
    }

    /**
     * Boolean indicator for announced status.
     */
    public function getIsAnnouncedAttribute(): bool
    {
        return $this->status === 'called';
    }

    /**
     * Alias for position.
     */
    public function getDesignationAttribute(): ?string
    {
        return $this->position;
    }

    /**
     * Alias for agency_name (office_agency).
     */
    public function getOfficeAgencyAttribute(): ?string
    {
        return $this->agency_name;
    }

    public function setOfficeAgencyAttribute(?string $value): void
    {
        $this->attributes['agency_name'] = $value;
    }

    /**
     * Get the event that the attendee is registered for.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the category of the guest attendee.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(GuestCategory::class, 'category_id');
    }

    /**
     * Get the province of the attendee.
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class, 'province_id', 'prov_code');
    }

    /**
     * Get the city or municipality of the attendee.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id', 'city_code');
    }

    /**
     * Get the barangay of the attendee.
     */
    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'brgy_id', 'brgy_code');
    }

    /**
     * Get the user who created or registered the guest.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
